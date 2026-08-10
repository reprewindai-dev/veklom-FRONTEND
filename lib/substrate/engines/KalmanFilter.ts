export class KalmanFilter {
  private estimate: number;
  private errorCovariance: number;
  private processNoise: number = 1e-4;  // Systemic structural shift speed
  private measurementNoise: number = 1e-2; // M2M Brownian API noise

  constructor(initialEstimate: number) {
    this.estimate = initialEstimate;
    this.errorCovariance = 1.0;
  }

  /**
   * Filters out chaotic market/network noise to reveal the true underlying cycle.
   */
  public filter(measurement: number): number {
    let priorCovariance = this.errorCovariance + this.processNoise;
    let kalmanGain = priorCovariance / (priorCovariance + this.measurementNoise);

    this.estimate = this.estimate + kalmanGain * (measurement - this.estimate);
    this.errorCovariance = (1 - kalmanGain) * priorCovariance;

    return this.estimate;
  }
}
