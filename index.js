require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@practice.hcuo4.mongodb.net/?retryWrites=true&w=majority&appName=practice`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const jobCollection = client.db("jobPortal").collection("jobs");
    const jobApplicationCollection = client
      .db("jobPortal")
      .collection("job_applications");

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const jobs = await jobCollection.find(query).toArray();
      res.send(jobs);
    });
    app.get("/job-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const jobs = await jobCollection.findOne(query);
      // const jobs = await jobCollection.find().toArray();
      res.send(jobs);
    });
    // updated
    app.patch("/job-application/:id", async (req, res) => {
      const id = req.params.id;
      const { value } = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedStatus = {
        $set: {
          status: value,
        },
      };

      const application = await jobApplicationCollection.updateOne(
        query,
        updatedStatus
      );
      console.log(value);
      res.send(application);
    });
    // auth retated api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false, // http://localhost:3000
        })
        .send({ success: true });
    });
    // job application
    app.post("/job-application", async (req, res) => {
      const application = req.body;
      const result = await jobApplicationCollection.insertOne(application);
      //  not the best way
      const id = application.job_id;
      const query = { _id: new ObjectId(id) };
      const job = await jobCollection.findOne(query);
      let newCount = 0;
      if (job.applicationCount) {
        newCount = job.applicationCount + 1;
      } else {
        newCount = 1;
      }
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          applicationCount: newCount,
        },
      };
      const updatedResult = await jobCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.post("/add-jobs", async (req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result);
    });
    //
    app.get("/job-application/job/:job_id", async (req, res) => {
      const jobId = req.params.job_id;
      console.log(jobId);
      const query = { job_id: jobId };
      const job = await jobApplicationCollection.find(query).toArray();
      res.send(job);
    });
    app.get("/job-application", async (req, res) => {
      const email = req.query.email;
      const query = { user_email: email };
      const jobs = await jobApplicationCollection.find(query).toArray();
      for (const application of jobs) {
        console.log(application.job_id);
        const filter = { _id: new ObjectId(application.job_id) };
        const job = await jobCollection.findOne(filter);
        if (job) {
          application.title = job.title;
          application.company = job.company;
        }
      }
      res.send(jobs);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("listening on", port);
});
