const Button = ({
    children = undefined,
    onClick = undefined,
    hoverColor = '#00BFFF',
    className = '',
    url = undefined,
    newWindow = false
}) => {
    return (
        <a
            className={className}
            href={url}
            onClick={onClick}
            target={`${newWindow ? '_blank' : ''}`}>
            {children}
            <style jsx>{`
                * {
                    box-sizing: inherit;
                    transition-property: all;
                    transition-duration: 0.6s;
                    transition-timing-function: ease;
                }

                a {
                    color: #fff;
                    text-decoration: none;
                    font-size: 16px;
                    text-align: center;
                    background: rgba(0, 0, 0, 0.7);
                    color: #fff;
                    line-height: 1.4;
                    padding: 0.25em;
                    text-decoration: none;
                    box-shadow: inset 0 0 20px rgba(255, 255, 255, 0);
                    border: 1px solid;
                    border-color: gray;
                    border-offset: 0px;
                    text-shadow: none;
                    -webkit-transition: all 1250ms cubic-bezier(0.19, 1, 0.22, 1);
                    transition: all 1250ms cubic-bezier(0.19, 1, 0.22, 1);
                    color: #fff;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 400;
                    line-height: 45px;
                    margin: 0 0 0.4rem;
                    position: relative;
                    padding: 0 1rem;
                    text-decoration: none;
                    text-transform: uppercase;
                    width: 100%;
                    border-radius: 4px;
                }

                @media (min-width: 600px) {
                    .a {
                        margin: 0 1em 2em;
                    }
                }

                a:hover,
                a:active,
                a:focus,
                .selected {
                    background: light-blue;
                    color: ${hoverColor};
                    text-decoration: none;
                    box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.5),
                        0 0 20px rgba(255, 255, 255, 0.2);
                    outline-color: rgba(255, 255, 255, 0);
                    outline-offset: 15px;
                    text-shadow: 1px 1px 2px #427388;
                }

                .selected {
                    color: ${hoverColor};
                }

                .SubmitButton {
                    margin-top: 1rem;
                    max-width: 8rem;
                }

                .IntelButton {
                    margin-top: 1rem;
                    max-width: 8rem;
                    margin-right: 1rem;
                }
                .PathButton {
                    max-width: 20rem;
                    margin-top: 1rem;
                }
            `}</style>
        </a>
    )
}

export default Button
