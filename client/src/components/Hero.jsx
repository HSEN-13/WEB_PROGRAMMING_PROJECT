import "./Hero.css";
import imgHero from "../assets/web_pic2.png";

function Hero() {
  return (
    <div className="hero-wrapper">
      <section className="hero">
        <div className="hero-content">
          <h1>Buy and sell computer hardware.</h1>
          <p>
            Find your next upgrade, make an offer, and arrange pickup with the
            seller.
          </p>
          <div className="hero-btns">
            <a href="/marketplace" className="btn-primary">
              Browse Hardware
            </a>
            <a href="/sell" className="btn-secondary">
              Sell your hardware &rarr;
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
