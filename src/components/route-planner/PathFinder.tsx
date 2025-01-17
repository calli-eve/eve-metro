import PathCalculator from './PathCalculator'

const PathFinder = () => {
    return (
        <>
            <div className="container">
                <PathCalculator />
            </div>
            <style jsx>{`
                .container {
                    height: 100%;
                    width: 100%;
                    margin-top: 1.5rem;
                }
            `}</style>
        </>
    )
}

export default PathFinder
