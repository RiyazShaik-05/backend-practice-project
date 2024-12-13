import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CROSS_ORIGIN,
    credentials: true
}))


//routes import

import userRouter from "./routes/user.routes.js";


//routes usage

app.use("/api/v1/users",userRouter);

export default app;