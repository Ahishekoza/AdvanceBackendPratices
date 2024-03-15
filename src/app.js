import express from 'express';
import cookieParser from 'cookie-parser';
const app = express();

app.use(express.json({limit:'16kb'}))
app.use(express.urlencoded({extended:true, limit:'16kb'})) 
app.use(express.static("../public")) // To store the data coming from the client server
app.use(cookieParser())


// import Route
import userRoute from './routes/user.route.js'

app.use('/api/v1/users',userRoute)

export {app}