require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
      const jobs = await jobCollection.find().toArray();
      res.send(jobs);
    });
    app.get("/job-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const jobs = await jobCollection.findOne(query);
      // const jobs = await jobCollection.find().toArray();
      res.send(jobs);
    });

    // job application
    app.post("/job-application", async (req, res) => {
      const job = req.body;
      const result = await jobApplicationCollection.insertOne(job);
      res.send(result);
    });
    app.post("/add-jobs", async (req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result);
    });
    //
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
