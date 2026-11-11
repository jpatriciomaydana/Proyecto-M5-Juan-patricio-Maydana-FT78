import type { JSX } from "react";
import { Link } from "react-router-dom";

function Home(): JSX.Element {
    return (
        <div className="home">
            <section className="home-hero">
                <div className="home-hero__content">
                    <p className="home-hero__eyebrow">
                        UN LIBRO, UN NUEVO MUNDO
                    </p>

                    <h1>
                        Historias que
                        <br />
                        merecen ser <span>descubiertas.</span>
                    </h1>

                    <p className="home-hero__description">
                        Explorá nuestra colección de libros y encontrá
                        esa historia que estabas esperando leer.
                    </p>

                    <div className="home-hero__actions">
                        <Link to="/catalogo" className="home-button">
                            Explorar catálogo
                            <span aria-hidden="true">→</span>
                        </Link>

                        <a href="#sobre-nosotros" className="home-button home-button--secondary">
                            Nuestra librería
                        </a>
                    </div>
                </div>

                <div className="home-hero__decoration" aria-hidden="true">
                    <img
                        className="home-hero__decoration-logo"
                        src="/logo.png"
                        alt=""
                    />
                    <span className="home-hero__decoration-label">
                        El placer de leer
                    </span>
                </div>
            </section>

            <section className="home-intro" id="sobre-nosotros">
                <p className="home-intro__eyebrow">MÁS QUE LIBROS</p>

                <h2>
                    Cada libro tiene una historia.
                    <br />
                    <span>La próxima puede ser la tuya.</span>
                </h2>

                <p>
                    Descubrí títulos para todos los gustos, desde novelas
                    inolvidables hasta joyas para quienes disfrutan coleccionar
                    libros.
                </p>

                <Link to="/catalogo" className="home-intro__link">
                    Descubrir libros <span aria-hidden="true">→</span>
                </Link>
            </section>
        </div>
    );
}

export default Home;