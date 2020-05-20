import {default as fs} from 'fs';
import {default as path} from 'path';
import {default as express} from 'express';
import {default as axios} from 'axios';
import {Docker, Composter} from 'docker-composter';
import {getComposterData, getUpdateData} from './utils';

const app = express();
const port = process.env.PORT || 8888;

app.use(express.json());
app.post('/updatedImages', async (req, res) => {
  let images = req.body.data.split(',');
  console.log(images);

  update(images);

  res.sendStatus(200);
});
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

async function update(updatedImages) {
  const composterData = await getComposterData(fs, path, process.env.BASE_PATH);
  const {imagesToBeUpdated, containersToBeUpdated} = getUpdateData(updatedImages, composterData);
  const request = axios.create({
    socketPath: '/var/run/docker.sock'
  });
  const docker = new Docker(request, console);
  const composter = new Composter(docker, console);

  await Promise.all(imagesToBeUpdated.map(elem => pullImage(request, elem)));

  for (const composterFile in containersToBeUpdated) {
    for (const containerName of containersToBeUpdated[composterFile]) {
      console.log(`stop, wait for, and remove container "${containerName}"`);
      await removeContainer(request, containerName);
    }
    console.log(`recreate containers from "${composterFile}"`);
    await composter.up(composterData[composterFile]);
  }
}
