const express = require("express");
const axios = require("axios");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const twilio = require("twilio");
require('dotenv').config();

const app = express();
app.use(express.json());

const FIREBASE_URL = "https://classroomdb-e362e-default-rtdb.asia-southeast1.firebasedatabase.app/firebaseRealtimeDB/classroom_dbinstance";
//FIREBASE rules are PUBLIC

//Swagger
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Classroom Management API",
            version: "1.0.0",
            description: "API for testing Firebase Realtime DB",
        },
    },
    apis: ["./server.js"], // lấy comment từ file này
};
const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /auth:
 *   get:
 *     summary: Get all authentication records
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: List of all auth records
 *       500:
 *         description: Server error
 */

app.get("/auth", async (req, res) => {
    try {
        const response = await axios.get(`${FIREBASE_URL}/auth.json`);
        res.json(response.data);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /createAccessCode:
 *   post:
 *     summary: Generate a new 6-digit access code for a phone number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNum:
 *                 type: string
 *                 example: "0913014027"
 *     responses:
 *       201:
 *         description: Access code created successfully
 *       400:
 *         description: Missing phoneNum
 *       500:
 *         description: Server error
 */

app.post("/createAccessCode", async (req, res) => {
    try {
        // const phoneNum = 123123123;//test
        let { phoneNum } = req.body;
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
        const client = twilio(accountSid, authToken);


        if (phoneNum == null) {
            return res.status(400).json({ error: "Not have the Phone Number" });
        } else {
            phoneNum = "+84" + phoneNum.slice(1); //Vietnam phone number must be +84 first, remove '0'.

        }

        const accessCode = Math.floor(100000 + Math.random() * 900000).toString();

        const response = await axios.post(`${FIREBASE_URL}/auth.json`, { phoneNum, accessCode });

        await client.messages.create({
            body: `Your access code is: ${accessCode}`,
            from: twilioPhone, // Twilio số thuê bao
            to: phoneNum,      // số điện thoại user
        });

        res.json({
            msg: "Access Code Generated",
            phoneNum,
        });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

/**
 * @swagger
 * /auth:
 *   get:
 *     summary: Get authentication records by ID
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: List of all auth records
 *       500:
 *         description: Server error
 */

app.get("/auth", async (req, res) => {
    try {
        const { token } = req.body;
        const { accessCode } = req.body;

        if (!token) {
            return res.status(400).json({ error: "You are not login yet" });
        }

        const response = await axios.get(`${FIREBASE_URL}/auth.json`);
        res.json(response.data);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});





const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});