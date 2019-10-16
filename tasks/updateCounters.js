/* Copyright 2019 Schibsted */

const Source = require('../apps/common/models/source');
const Counter = require('../apps/common/models/counter');
const Journal = require('../apps/common/models/journal');

const updateCounters = async function() {
  console.log('Start updating counters.');
  const counters = [{}];
  const sources = await Source.fetch();

  // Count journal entries per project.
  counters.push(
    ...sources.reduce((acc, source) => {
      const item = acc.find(
        counter => counter.project_id === source.project_id,
      );

      if (!item) {
        acc.push({ project_id: source.project_id });
      }

      return acc;
    }, []),
  );

  // Count journal entries per project and source.
  counters.push(
    ...sources.map(source => ({
      project_id: source.project_id,
      source_id: source.id,
    })),
  );

  console.log('Fetching counts.');
  const counts = [];

  for (let i = 0; i < counters.length; i++) {
    const counter = counters[i];

    console.log(
      `Fetching with the following filters: ${JSON.stringify(counter)}`,
    );

    const count = await Journal.count(counter);

    counts.push({
      ...counter,
      count,
    });
  }

  console.log('Deleting all counters.');
  await Counter.query().delete();
  console.log('Adding counters.');
  await Promise.all(
    counts.map(async counter => await Counter.query().insert(counter)),
  );

  process.exit(0);
};

(async function() {
  await updateCounters();
})();
