const express = require('express');
require('dotenv').config();
const cors = require('cors')
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;



app.use(cors())
app.use(express.json());


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

app.post('/app/v1/users', async (req, res) => {
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

            if(userData.role === "buyer"){
                userAddCoin = {...userData, coins : 50}
            }else if (userData.role === 'worker'){
                userAddCoin = {...userData, coins : 10}
            } else{
                return
            }

            const result = await usersCollection.insertOne(userAddCoin)
            res.send(result)

            
            
        }


    } catch (error) {
        console.log(error.message)

    }
})




app.get('/', async (req, res) => {
    res.send(`Hello i am server i am working fine`)
})


app.listen(port, () => {
    console.log(`Server is running port ${port}`)
})