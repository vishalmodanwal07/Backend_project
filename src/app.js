import express, { Router } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app =express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


//app configrations--> all configration is basically use() method   app.use()

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended:true , limit:"16kb"}));
app.use(express.static("publicuse"));
app.use(cookieParser());

//router import 
import userRouter from "./routes/user.routes.js"

const route =Router();
//route decleration
app.use("/api/v1/users" , userRouter);

//http://localhost:8000/api/v1/users/register
export default app