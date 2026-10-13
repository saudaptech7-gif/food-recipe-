function Loading() {
  return (
    <div className="savorly-loader" role="status" aria-live="polite">
      <div className="savorly-loader-visual">
        <div className="loader-orbit loader-orbit-one" />
        <div className="loader-orbit loader-orbit-two" />

        <div className="loader-plate">
          <div className="loader-plate-inner">
            <span className="loader-food loader-food-one" />
            <span className="loader-food loader-food-two" />
            <span className="loader-food loader-food-three" />
            <span className="loader-leaf">✦</span>
          </div>
        </div>

        <span className="loader-spark loader-spark-one">✦</span>
        <span className="loader-spark loader-spark-two">✧</span>
      </div>

      <h2 className="savorly-loader-title">Savorly</h2>

      <p className="savorly-loader-text">
        Preparing something delicious
      </p>

      <div className="savorly-loader-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default Loading;