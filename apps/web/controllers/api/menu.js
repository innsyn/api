/* Copyright 2019 Schibsted */

const Project = require('../../../common/models/project');

class MenuController {
  async browse(req, res) {
    const result = await Project.fetch();

    const data = result.map(({ id, name, description, sources }) => ({
      id,
      name,
      description,
      lists: sources.reduce((acc, { id, name, description, email, list }) => {
        const hit = acc.find(item => item.id === (list ? list.id : ''));

        const source = {
          id,
          name,
          description,
          email,
        };

        if (hit) {
          hit.sources.push(source);
        } else if (list) {
          acc.push({
            id: list.id,
            name: list.name,
            description: list.description,
            sources: [source],
          });
        } else {
          acc.push({
            id: '',
            name: '',
            description: '',
            sources: [source],
          });
        }

        return acc;
      }, []),
    }));

    // TODO: Improve!
    // Sort sources
    for (let project of data) {
      project.lists = project.lists.sort(function(a, b) {
        let nameA = a.name.toUpperCase();
        let nameB = b.name.toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });

      for (let list of project.lists) {
        list.sources = list.sources.sort(function(a, b) {
          let nameA = a.name.toUpperCase();
          let nameB = b.name.toUpperCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
      }
    }

    res.send({
      projects: data,
    });
  }
}

const instance = new MenuController();
Object.freeze(instance);

module.exports = instance;
