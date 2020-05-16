import {default as express} from 'express';

const app = express();
const port = process.env.PORT || 8888;

app.use(express.json());
app.post('/updatedImages', async (req, res) => {
  let images = req.body.data.split(',');
  console.log(images);
});
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));
