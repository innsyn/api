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
  const result = await Promise.all(
    counters.map(async counter => ({
      ...counter,
      count: await Journal.count(counter),
    })),
  );

  console.log('Deleting all counters.');
  await Counter.query().delete();
  console.log('Adding counters.');
  await Promise.all(
    result.map(async counter => await Counter.query().insert(counter)),
  );

  process.exit(0);
};

(async function() {
  await updateCounters();
})();
