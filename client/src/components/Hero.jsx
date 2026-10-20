import "./Hero.css";
import imgHero from "../assets/web_pic2.png";

function Hero() {
  return (
    <div className="hero-wrapper">
      <section className="hero">
        <div className="hero-content">
          <h1>Buy and sell PC hardware with engineering students.</h1>
          <p>
            Upgrade your rig without the risk. A peer-to-peer marketplace built
            exclusively for students with real-time negotiation.
          </p>
          <div className="hero-btns">
            <a href="/marketplace" className="btn-primary">
              Browse Hardware
            </a>
            <a href="#how-it-works" className="btn-secondary">
              Learn how it works &rarr;
            </a>
          </div>
        </div>
        <div className="hero-visual">
          <img src={imgHero} alt="Home page pic" />
        </div>
      </section>
    </div>
  );
}

export default Hero;
