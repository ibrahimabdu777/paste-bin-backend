import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/pastes/", async (req, res) => {
  
  const dbres = await client.query('select * from snippets');
  res.status(200).json({
    status: "success",
    data: {
      snippets: dbres.rows
    },
  });
});

app.get("/pastes/:id", async (req, res) => {
  const {id} = req.params
  const dbres = await client.query('select * from snippets where id=$1', [id]);
  res.status(200).json({
    status: "success",
    data: {
      snippet: dbres.rows
    },
  });
});

app.post("/pastes/", async (req, res) => {
  
  const {title, text} = req.body
  const createdSnippet = await client.query('insert into snippets (title, text) values ($1, $2) returning *', [title, text]);
  res.status(201).json({
    status: 'success', 
    data: {
      snippet: createdSnippet.rows
    }
})});

app.patch("/pastes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const {title, text} = req.body
  const updatedSnippet = await client.query('update snippets set title = $1, text = $2 where id = $3 returning *', [title, text, id]);
  res.status(201).json({
    status: 'success', 
    data: {
      snippet: updatedSnippet.rows
    }
})});
app.delete("/pastes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const deletedSnippet = await client.query('delete from snippets where id=$1 returning *', [id]);
  res.status(201).json({
    status: 'success', 
    data: {
      snippet: deletedSnippet.rows
    }
})});
//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
