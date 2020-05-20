export async function getComposterData(fs, path, basePath) {
  return (await getDirectoryContents(fs, basePath))
  .filter(elem => elem.isDirectory())
  .map(elem => path.join(basePath, elem.name, 'docker-composter.json'))
  .reduce((acc, curr) => {
    if (!fs.existsSync(curr)) {
      return acc;
    }

    acc[curr] = JSON.parse(fs.readFileSync(curr));

    return acc;
  }, {});
}

export function getUpdateData(updatedImages, composterData) {
  let imagesToBeUpdated = {};
  let containersToBeUpdated = {};

  for (const composterFile in composterData) {
    const composterFileData = composterData[composterFile];

    for (const containerName in composterFileData.containers) {
      const containerData = composterFileData.containers[containerName];
      const imageName = containerData.config.Image;

      if (updatedImages.includes(imageName)) {
        imagesToBeUpdated[imageName] = true;
        
        if (typeof containersToBeUpdated[composterFile] == 'undefined') {
          containersToBeUpdated[composterFile] = [];
        }

        containersToBeUpdated[composterFile].push(containerName);
      }
    }
  }

  return {imagesToBeUpdated: Object.keys(imagesToBeUpdated), containersToBeUpdated};
}

export function pullImage(request, imageName) {
  return request({
    method: 'post',
    url: '/images/create',
    params: {fromImage: imageName}
  });
}

export async function removeContainer(request, containerName) {
  const container = (await request({
    method: 'get',
    url: '/containers/json',
    params: {all: true}
  })).data.find(cont => cont.Names.includes(containerName));
  
  if (typeof container == 'undefined') {
    return;
  }

  const containerInfo = (await request({
    method: 'get',
    url: `/containers/${container.Id}/json`
  })).data;

  if (containerInfo.State.Running) {
    await request({
      method: 'post',
      url: `/containers/${container.Id}/stop`
    });
    await request({
      method: 'post',
      url: `/containers/${container.Id}/wait`
    });
  }

  await request({
    method: 'delete',
    url: `/containers/${container.Id}`
  });
  await request({
    method: 'post',
    url: `/containers/${container.Id}/wait`,
    params: {condition: 'removed'}
  });
}

function getDirectoryContents(fs, path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, {withFileTypes: true}, (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(files);
    });
  });
}
