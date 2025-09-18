import React from "react";



export default class ErrorBoundary extends React.Component {
    constructor (props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("❗ React ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: "1rem",
                    margin: "2rem",
                    border: "2px solid red",
                    borderRadius: "0.5rem",
                    background: "#ffecec",
                    color: "#a00",
                    fontFamily: "sans-serif"
                }}>
                    <h2>⚠️ Ошибка в приложении</h2>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {String(this.state.error)}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}