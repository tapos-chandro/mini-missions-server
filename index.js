const express = require('express');
require('dotenv').config();
const cors = require('cors');
// const morgan = require('morgan')
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);



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
const tasksCollection = client.db('mini-missions').collection('tasks');
const packageCollection = client.db('mini-missions').collection('packages');
const paymentCollection = client.db('mini-missions').collection('payment');
const submissionsCollection = client.db('mini-missions').collection('submissions');
const withdrawalsCollection = client.db('mini-missions').collection('withdrawals');
const notificationsCollection = client.db('mini-missions').collection('notifications');



app.post('/jwt', async (req, res) => {
    try {
        const email = req.body;
        const filter = { email }

        await usersCollection.findOne(filter)
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

const adminRole = async (req, res, next) => {
    try {
        const userEmail = req?.email
        if (!userEmail) {
            return res.status(401).json({ message: 'Unauthorized: No user email found' });
        }
        const filter = { email: userEmail }
        const user = await usersCollection.findOne(filter);


        if (user.role !== "admin") {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        next()
    } catch (error) {
        console.log(error.message)

    }

}

// buyer role related middleware

const buyerRole = async (req, res, next) => {
    const userEmail = req?.email
    const filter = { email: userEmail }
    const user = await usersCollection.findOne(filter);
    if (user.role !== "buyer") {
        return res.status(403).send({ message: 'forbidden access' })
    }
    next();
}

// worker role related middleware
const workerRole = async (req, res, next) => {
    const userEmail = req?.email;
    const filter = { email: userEmail }
    const user = await usersCollection.findOne(filter);

    if (user.role !== "worker") {
        return res.status(403).send({ message: 'forbidden access' })
    }
    next();
}

app.get('/api/v1/users', verifyToken, async (req, res) => {

    const email = req.query.email;

    if (email !== req?.email) {
        return res.status(401).send({ message: 'Unauthorized User' })
    } else {
        const filter = { email };
        const result = await usersCollection.findOne(filter)
        res.send(result);
    }

})

// get tasks related api 

app.get('/api/v1/tasks', async (req, res) => {

    const email = req.query.email;
    let filter = {};
    if (email) {
        filter = { email }
    } else {
        filter = {}
    }

    if (email) {

        const result = await tasksCollection.find(filter).toArray();
        res.send(result)
    } else {
        const result = await tasksCollection.find(filter).sort({ _id: -1 }).limit(6).toArray();
        res.send(result)
    }

})

app.get('/api/v1/available-task', async (req, res) => {

    const taskId = req.query.id;

    let filter = {}

    if (taskId) {
        filter = { _id: new ObjectId(taskId) }
    } else {
        filter = {}
    }
    const result = await tasksCollection.find(filter).toArray();
    const finalResult = result.filter(task => Number(task.required_workers) > 0)
    res.send(finalResult)


})

// get packages related api

app.get('/api/v1/package', async (req, res) => {
    const result = await packageCollection.find().toArray();
    res.send(result)
})



// get payment history related api 
app.get('/api/v1/payment-history', verifyToken, buyerRole, async (req, res) => {

    const email = req.query.email;
    if (email !== req?.email) {
        return res.status(401).send({ message: 'Unauthorized User' })
    }

    const filter = { email };
    const result = await paymentCollection.find(filter).toArray();
    res.send(result)
})

// submission get related api 

app.get('/api/v1/submissions', verifyToken, workerRole, async (req, res) => {
    const email = req.query.email;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 2;

    if (email !== req?.email) {
        return res.status(401).send({ message: 'Unauthorized User' })
    }

    const filter = { worker_email: email };
    const submissions = await submissionsCollection.find(filter).skip((page - 1) * limit).limit(limit).toArray();
    const submissionsCount = (await submissionsCollection.find(filter).toArray()).length;
    res.send({ submissions, submissionsCount })
})

// approve submissions related api
app.get('/api/v1/approve-submissions', verifyToken, workerRole, async (req, res) => {
    const email = req.query.email;

    if (email !== req?.email) {
        return res.status(401).send({ message: 'Unauthorized User' })
    }

    const filter = { worker_email: email, status: "approved" }
    const result = await submissionsCollection.find(filter).toArray()
    res.send(result)
})
//user states related api 
app.get('/api/v1/states', verifyToken, workerRole, async (req, res) => {
    try {
        const email = req.query.email;
        if (email !== req?.email) {
            return res.status(401).send({ message: 'Unauthorized User' })
        }
        const userFilter = { email, role: 'worker' }
        const filter = { worker_email: email };
        const pending = { worker_email: email, status: 'pending' };

        const totalSubmissions = (await submissionsCollection.find(filter).toArray()).length;
        const pendingSubmissions = (await submissionsCollection.find(pending).toArray()).length;
        const user = await usersCollection.findOne(userFilter); // assuming one user per email
        const withdrawals = await withdrawalsCollection.find(filter).toArray();

        const withdrawalEarning = withdrawals.reduce(
            (sum, current) => sum + (current?.withdrawal_coin || 0),
            0
        );

        const totalEarning = (withdrawalEarning + user?.coins) / 20

        res.send({
            totalSubmissions,
            pendingSubmissions,
            totalEarning,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

// platform states related api
app.get('/api/v1/platform-states', async (req, res) => {
    // const totalWorkers = (await usersCollection.find(workerFilter).toArray()).length;
    const filter = {
        role: "worker"
    }
    const totalWorkers = (await usersCollection.find(filter).toArray()).length;
    const filterApprove = {
        status: 'approved'
    }
    const totalCompletedTask = (await submissionsCollection.find(filterApprove).toArray()).length;
    const totalTasks = await tasksCollection.estimatedDocumentCount();

    res.send({ totalTasks, totalCompletedTask, totalWorkers, })
})

// admin states related api 
app.get('/api/v1/admin-states', verifyToken, adminRole, async (req, res) => {
    const adminEmail = req.query.email;
    if (adminEmail !== req?.email) {
        return res.status(401).send({ message: 'Unauthorized User' })
    }

    const workerFilter = { role: "worker" }
    const buyerFilter = { role: 'buyer' }
    const totalWorkers = (await usersCollection.find(workerFilter).toArray()).length;
    const totalBuyers = (await usersCollection.find(buyerFilter).toArray()).length;
    const totalUser = await usersCollection.find().toArray();
    const totalCoins = totalUser.reduce((sum, current) => sum + current.coins, 0);
    const payment = await paymentCollection.find().toArray();
    const totalPayments = payment.reduce((sum, current) => sum + current.amount, 0);
    res.send({ totalWorkers, totalBuyers, totalCoins, totalPayments })

})

// buyer states related api

app.get('/api/v1/buyer-states', async (req, res) => {
    const buyerEmail = req.query.email;

    const taskFilter = { email: buyerEmail }
    const filter = { Buyer_email: buyerEmail, status: "pending" }
    const filterPayment = { email: buyerEmail }
    const totalTasks = (await tasksCollection.find(taskFilter).toArray()).length;
    const pendingWorks = (await submissionsCollection.find(filter).toArray()).length;
    const payment = await paymentCollection.find(filterPayment).toArray();

    const totalPayment = payment.reduce((sum, current) => sum + current?.amount, 0) / 100
    res.send({ totalTasks, pendingWorks, totalPayment })
})

// withdrawal related api
app.get('/api/v1/withdrawals', verifyToken, adminRole, async (req, res) => {
    const email = req.query.email;
    if (email !== req?.email) {
        return res.status(401).send({ message: 'Unauthorized User' })
    }

    const withdrawals = await withdrawalsCollection.find().toArray();
    res.send(withdrawals)
})

// get admin all user related api 
app.get('/api/v1/all-user', verifyToken, adminRole, async (req, res) => {

    const email = req.query.email;
    if (email !== req?.email) {
        return res.status(401).send({ message: 'Unauthorized User' })
    }
    const result = await usersCollection.find().toArray();
    res.send(result)
})

// submissions buyer review 
app.get('/api/v1/submissions-review', async (req, res) => {
    const email = req.query.email;
    const filter = { Buyer_email: email, status: "pending" }
    const result = await submissionsCollection.find(filter).toArray();
    res.send(result)
})

// notification get related api
app.get('/api/v1/notification', async (req, res) => {
    const email = req.query.email;
    const buyerFilter = { Buyer_email: email }
    const workerFilter = { worker_email: email }

    const buyerResult = await notificationsCollection.find(buyerFilter).toArray();
    const workerResult = await notificationsCollection.find(workerFilter).toArray();
    res.send({ buyerResult, workerResult })

})

app.get('/api/v1/top-workers', async (req, res) => {
    const filter = { role: 'worker' }
    const topWorker = await usersCollection.find(filter).sort({ coins: -1 }).limit(6).toArray();
    res.send(topWorker)
})

// add task related api 

app.post('/api/v1/add-task', async (req, res) => {
    const addTaskData = req.body;

    const result = await tasksCollection.insertOne(addTaskData);
    res.send(result)

})


// users add related api 

app.post('/api/v1/users', async (req, res) => {
    try {
        const userData = req.body;
        const filter = { email: userData.email }
        const findEmail = await usersCollection.findOne(filter)


        if (findEmail) {
            res.send('already user ')
            return
        } else {
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

// payment history inserted relate api
app.post('/api/v1/payment', async (req, res) => {
    const paymentData = req.body;

    const result = await paymentCollection.insertOne(paymentData)
    res.send(result)

})

// submissions related api 
app.post('/api/v1/submission', async (req, res) => {
    try {

        const submission = req.body;
        // const buyerEmail = {}


        const notificationsData = {
            message: `${req?.body?.worker_name} has submitted work for your task: ${req.body.task_title}`,
            Buyer_email: req?.body?.Buyer_email,
            time: new Date(),
        }

        const result = await submissionsCollection.insertOne(submission);

        await notificationsCollection.insertOne(notificationsData);


        const filter = { _id: new ObjectId(submission?.task_id) }
        const updateDoc = {
            $inc: {
                required_workers: - 1
            }
        }
        await tasksCollection.updateOne(filter, updateDoc)
        res.send(result);
    } catch (error) {
        console.log(error.message)
    }

})

// withdrawals related api
app.post('/api/v1/withdrawals', async (req, res) => {
    const withdrawalData = req.body;
    const result = await withdrawalsCollection.insertOne(withdrawalData)
    res.send(result)
})

// users relate api 
app.patch('/api/v1/users', async (req, res) => {
    try {
        const email = req.query.email;
        const payAmount = req.body.amount;

        const filter = { email };
        const updateDoc = {
            $inc: { coins: -payAmount } // This is better than $set if you're decreasing
        };

        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);



    } catch (error) {

    }


})

app.patch('/api/v1/update-task', async (req, res) => {
    try {
        const taskId = req.query.id
        const { task_title, task_detail, submission_info } = req.body;

        const filter = { _id: new ObjectId(taskId) }

        const options = { upsert: true };

        const updateDoc = {
            $set: {
                task_title,
                task_detail,
                submission_info,
            }
        }


        const result = await tasksCollection.updateOne(filter, updateDoc, options)
        res.send(result)

    } catch (error) {
        console.log(error.message)
    }
})





// payment relate api 

app.post('/api/v1/secret', async (req, res) => {
    const amount = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount?.amount,
        currency: 'usd',
        payment_method_types: ['card'],
        statement_descriptor: 'Custom descriptor',
    });

    // res.json({client_secret: intent.client_secret});
    res.json({ client_secret: paymentIntent.client_secret });


})

// updata user coin relate api

app.patch('/api/v1/update-coins', async (req, res) => {
    try {
        const updateCoins = req.body;
        const email = req.query.email;

        const filter = { email };
        const updateDoc = {
            $inc: { coins: updateCoins.addCoins }
        };

        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update coins' });
    }
});



app.patch('/api/v1/withdrawal-approve', async (req, res) => {
    const id = req.query.id

    const filter = { _id: new ObjectId(id) }

    const findWithdrawal = await withdrawalsCollection.findOne(filter);



    const notificationData = {
        message: `Your withdrawal request of $${findWithdrawal?.withdrawal_amount} has been approved by the admin.`,
        worker_email: findWithdrawal?.worker_email,
        time: new Date()
    }
    await notificationsCollection.insertOne(notificationData)

    const updateDoc = {
        $set: {
            status: 'approved'
        }
    }

    const result = await withdrawalsCollection.updateOne(filter, updateDoc)
    res.send(result)

})

// approved submission related api 
app.patch('/api/v1/approved-submission', async (req, res) => {
    const id = req.query.id;
    const email = req.body;

    const filter = { _id: new ObjectId(id) }
    const workerFilter = { email: email?.worker_email }
    // status update doc 
    const updateDoc = {
        $set: {
            status: "approved"
        }
    }

    const findSubmission = await submissionsCollection.findOne(filter)

    const workerUpdateDoc = {
        $inc: {
            coins: Number(findSubmission?.payable_amount)
        }
    }
    await usersCollection.updateOne(workerFilter, workerUpdateDoc)

    // notifications inserted 
    const notification = {
        message: `you have earned ${findSubmission?.payable_amount} coins from ${findSubmission?.Buyer_name} for completing ${findSubmission?.task_title}`,
        worker_email: email?.worker_email,
        time: new Date()
    }


    await notificationsCollection.insertOne(notification)

    const submissionStatus = await submissionsCollection.updateOne(filter, updateDoc)
    res.send(submissionStatus)
})

// update user role related api 
app.patch('/api/v1/update-role', async (req, res) => {
    const email = req.query.email;
    const userId = req.query.id;
    const role = req.body
    if (!userId) {
        return
    }
    const filter = { _id: new ObjectId(userId) }
    const updateDoc = {
        $set: {
            role: role?.role
        }
    }

    const result = await usersCollection.updateOne(filter, updateDoc)
    res.send(result)


})


// user delete related api 

app.delete('/api/v1/user-delete', async (req, res) => {

    const userId = req.query.id;
    const filter = { _id: new ObjectId(userId) }
    const result = await usersCollection.deleteOne(filter)
    res.send(result)

})

// task delete related api 
app.delete('/api/v1/delete-task', async (req, res) => {

    const taskId = req.query.id;
    const filter = { _id: new ObjectId(taskId) }
    const result = await tasksCollection.deleteOne(filter);
    res.send(result);

})

// submissions rejected related api 
app.delete('/api/v1/submission-reject', async (req, res) => {
    const id = req.query.id;

    const filter = { _id: new ObjectId(id) };
    const submission = await submissionsCollection.findOne(filter);
    const taskId = submission?.task_id;

    const filterTask = { _id: new ObjectId(taskId) }
    const updateTaskDoc = {
        $inc: { required_workers: + 1 }
    }

    const notificationDoc = {
        message: `Your submission for ${submission?.task_title} was rejected by ${submission?.Buyer_name}`,
        worker_email: submission?.worker_email,
        time: new Date()
    }
    await tasksCollection.updateOne(filterTask, updateTaskDoc)

    await notificationsCollection.insertOne(notificationDoc)

    const deleteSubmission = await submissionsCollection.deleteOne(filter)
    res.send(deleteSubmission)

})


// task deleted api

app.delete('/api/v1/task-delete', async (req, res) => {
    const id = req.query.id;
    const filter = {_id: new ObjectId(id)}
    const result = await tasksCollection.deleteOne(filter)
    res.send(result)
})

app.get('/', async (req, res) => {
    res.send(`Hello i am server i am working fine`)
})


app.listen(port, () => {
    console.log(`Server is running port ${port}`)
})