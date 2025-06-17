// import axios from 'axios';
// import { getCurrentCity } from '../screens/location';

// export const getWeather = async (message: string) => {
//   const isWeatherQuery = /thời tiết|trời/.test(message.toLowerCase());
//   try {
//     if (isWeatherQuery){
//     const city = await getCurrentCity(); 
//     const res = await axios.post('http://192.168.1.208:5000/weather', { message,city });
//     return res.data.reply;
//   }
//   // else{
//   //    const response = await axios.post('http://192.168.1.208:5000/chat', {
//   //     message: message,
//   //   });
//   //   return response.data.reply;
//   // }
// } catch (err) {
//     console.error(err);
//     return 'Không thể lấy thông tin thời tiết.';
//   }
// };
