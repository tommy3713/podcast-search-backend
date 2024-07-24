process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import express from 'express';
import cors from 'cors';
import { Client } from '@elastic/elasticsearch';
import path from 'path';
import fs from 'fs';
import { json } from 'stream/consumers';
import { fileURLToPath } from 'url';
import { search } from './service.js';
const app = express();
const port = 3000;

const client = new Client({
  node: 'http://elasticsearch:9200',
});
app.use(
  cors({
    origin: 'http://localhost:3001', // Set the allowed origin to your frontend's URL
    credentials: true,
  })
);
app.get('/api/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    const result = await search(keyword);
    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

app.get('/hello', (req, res) => {
  res.send({ message: 'Hello World!' });
});
app.get('/init', async (req, res) => {
  const directoryPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '/data'
  );
  // Asynchronously read the directory
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }
    // Filter and process only .json files
    files.forEach((file) => {
      if (path.extname(file) === '.json') {
        // Construct full file path
        let filePath = path.join(directoryPath, file);
        // Read and parse the JSON file
        fs.readFile(filePath, 'utf8', async (err, data) => {
          if (err) {
            console.error(`Error reading file ${file}:`, err);
            return;
          }
          // Parse and output the file content
          try {
            const jsonData = JSON.parse(data);
            console.log(`Data from ${file}:`, jsonData.uploadDate);
            console.log(`Data from ${file}:`, jsonData.podcaster);
            console.log(`Data from ${file}:`, jsonData.content);
            console.log(`Data from ${file}:`, jsonData.title);
            console.log(`Data from ${file}:`, jsonData.episode);
            console.log(`Data from ${file}:`, jsonData.fullTitle);
            const response = await client.index({
              index: 'podcast',
              document: {
                podcaster: jsonData.podcaster,
                content: jsonData.content,
                title: jsonData.title,
                uploadDate: jsonData.uploadDate,
                episode: jsonData.episode,
                fullTitle: jsonData.fullTitle,
              },
            });
            await client.indices.refresh({ index: 'podcast' });
          } catch (parseErr) {
            console.error(`Error parsing JSON from file ${file}:`, parseErr);
          }
        });
      }
    });
  });
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
