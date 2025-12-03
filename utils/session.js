// const db = require('../connectors/db');

// function getSessionToken(req) {
  
//   //console.log("cookie",req.headers.cookie);
//   if(!req.headers.cookie){
//     return null
//   }
//   const cookies = req.headers.cookie.split(';')
//     .map(function (cookie) { return cookie.trim() })
//     .filter(function (cookie) { return cookie.includes('session_token') })
//     .join('');

//   const sessionToken = cookies.slice('session_token='.length);
//   if (!sessionToken) {
//     return null;
//   }
//   return sessionToken;
// }

// async function getUser(req) {

//   const sessionToken = getSessionToken(req);
//   if (!sessionToken) {
//     console.log("no session token is found")
//     return res.status(301).redirect('/');
//   }


//   const user = await db.select('*')
//     .from({ s: 'FoodTruck.Sessions' })
//     .where('token', sessionToken)
//     .innerJoin('FoodTruck.Users as u', 's.userId', 'u.userId')
//     .first(); 

//   if(user.role == "truckOwner"){
//     const TruckRecord = await db.select('*')
//     .from({ u: 'FoodTruck.Trucks' })
//     .where('ownerId', user.userId)
//     // has no FoodTrucks
//     if(TruckRecord.length == 0){
//       console.log(`This ${user.name} has no owned trucks despite his role`);
//       console.log('user =>', user)
//       return user; 
//     }else{
//       const firstRecord = TruckRecord[0];
//       const truckOwnerUser =  {...user, ...firstRecord}
//       console.log('truck Owner user =>', truckOwnerUser)
//       return truckOwnerUser;
//     }
//   }

//   // role of customer
//   console.log('user =>', user)
//   return user;  
// }



// module.exports = {getSessionToken , getUser};
// utils/session.js
function getSessionToken(req) {
  // 1) Prefer the *last* session_token from the raw Cookie header
  if (req.headers && req.headers.cookie) {
    const parts = req.headers.cookie
      .split(';')
      .map(c => c.trim())
      .filter(c => c.startsWith('session_token='));

    if (parts.length > 0) {
      const last = parts[parts.length - 1]; // take the newest one
      const value = last.split('=')[1];
      if (value) return value;
    }
  }

  // 2) Fallback to cookie-parser result
  if (req.cookies && req.cookies.session_token) {
    return req.cookies.session_token;
  }

  // 3) Also allow custom Thunder headers if you want
  if (req.headers['session_token']) {
    return req.headers['session_token'];
  }
  if (req.headers['x-session-token']) {
    return req.headers['x-session-token'];
  }

  return null;
}

module.exports = {
  getSessionToken,
  // ... other exports like getUser if you have them
};
