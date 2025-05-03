const express = require('express');
require('dotenv').config();
const cors = require('cors');
// const morgan = require('morgan')
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');



app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5000'],
    credentials: true,
}))
app.use(express.json());
// app.use(morgan())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.elvxgab.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);

const usersCollection = client.db('mini-missions').collection('users')
const tasksCollection = client.db('mini-missions').collection('tasks')


app.post('/jwt', async (req, res) => {
    try {
        const email = req.body;

        const token = await jwt.sign(email, process.env.SECRET_TOKEN, { expiresIn: "1h" })
        res.send({ token })

    } catch (error) {
        console.log(error)
    }
})

const verifyToken = (req, res, next) => {

    const authHeader = req.headers.authorization
    if (!authHeader) { return res.status(401).send({ message: 'Unauthorized Access' }) }

    const token = authHeader.split(' ')[1]

    jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) { return res.status(403).send({ message: 'Forbidden Access' }) }
        req.email = decoded.email;
        next()
    })

}

app.post('/api/v1/add-task', async(req, res) => {
    const addTaskData = req.body;
    const result = await tasksCollection.insertOne(addTaskData);
    res.send(result)

})

app.post('/api/v1/users', async (req, res) => {
    try {
        const userData = req.body;
        const filter = { email: userData.email }
        const findEmail = await usersCollection.findOne(filter)


        if (findEmail) {
            res.send('already user ')
            return
        } else {

            console.log(userData.role)
            let userAddCoin = {}
            if (userData.role === "buyer") {
                userAddCoin = { ...userData, coins: 50 }
            } else if (userData.role === 'worker') {
                userAddCoin = { ...userData, coins: 10 }
            } else {
                return
            }

            const result = await usersCollection.insertOne(userAddCoin)
            res.send(result)
        }

    } catch (error) {
        console.log(error.message)

    }
})

app.get('/api/v1/users', verifyToken, async (req, res) => {


    const email = req.query.email;
    console.log(email, 'Clint site user')
    console.log(req?.email, 'Decoded email')
    if (email !== req?.email) {
        return res.status(401).send({ message: 'Unauthorized User' })
    } else {
        const filter = { email };
        const result = await usersCollection.findOne(filter)
        res.send(result);
    }


})




app.get('/', async (req, res) => {
    res.send(`Hello i am server i am working fine`)
})


app.listen(port, () => {
    console.log(`Server is running port ${port}`)
})