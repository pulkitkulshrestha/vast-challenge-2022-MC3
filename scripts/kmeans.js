/**
 * By Zoe Bridgham
 *
 * Returns K means clustering
 * @param data Must be an array of arrays, not a dictionary
 * @param k An int, number of clusters
 * @param maxIterations An int, max number of iterations
 * @returns
 *
 *
 */
function kmeans(data, k, maxIterations) {
    const centroids = initializeCentroids(data, k);
  while (centroids.some((centroid) => centroid === null))
    {
      console.log("in loop for null:", centroids)
      centroids = initializeCentroids(data, k);
    }
    let iterations = 0;
    let labels = Array.from({ length: data.length }, () => -1);

    while (iterations < maxIterations) {
      // Assign points to nearest centroid
      const clusters = Array.from({ length: k }, () => []);

      for (let i = 0; i < data.length; i++) {
        let minDistance = Infinity;
        let closestCentroid = null;

        for (let j = 0; j < centroids.length; j++) {
          const distance = euclideanDistance(data[i], centroids[j]);

          if (distance < minDistance) {
            minDistance = distance;
            closestCentroid = j;
          }
        }
        clusters[closestCentroid].push(data[i]);
        labels[i] = closestCentroid;
      }

      // Update centroids
      for (let i = 0; i < k; i++) {
        centroids[i] = computeCentroid(clusters[i]);
      }

      iterations++;
    }

    return {
      centroids: centroids,
      labels: labels
    };
  }

function euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
  };
function initializeCentroids(points, k) {
    const centroids = [];
    for (let i = 0; i < k; i++) {
      centroids.push(points[Math.floor(Math.random() * points.length)]);
    }
    return centroids;
};
function computeCentroid(points) {
  if (!points || points.length === 0) {
    return null;
  }

  const keys = Object.keys(points[0]);
  const numPoints = points.length;
  const numDimensions = keys.length;
  const centroid = {};

  for (let i = 0; i < numPoints; i++) {
    for (let j = 0; j < numDimensions; j++) {
      const key = keys[j];
      if (!centroid[key]) {
        centroid[key] = 0;
      }
      centroid[key] += points[i][key];
    }
  }

  for (let j = 0; j < numDimensions; j++) {
    const key = keys[j];
    centroid[key] /= numPoints;
  }

  return centroid;
}
