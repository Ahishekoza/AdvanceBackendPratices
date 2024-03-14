import mongoose from 'mongoose';
import dotenv from 'dotenv'
import { DB_NAME } from '../constants.js';
dotenv.config()


 const connectDB = async()=>{
    try {
        const connectInstance = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        console.log(`\nMongoDB_Connected !!! ${connectInstance.connection.host}`);
    } catch (error) {
        console.error("Error: ", error)
        process.exit(1)
    }
}


export default connectDB