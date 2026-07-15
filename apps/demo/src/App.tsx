import { AskProvider, AskChat } from "@arcxp/ask-the-news-components";

function App() {
    // Wire the components to the Ask The News API. `AskProvider` builds the SDK
    // client from this config and exposes it to every component/hook below it.
    return (
        <AskProvider
            baseUrl={import.meta.env.VITE_ATN_BASE_URL}
            website={import.meta.env.VITE_ATN_WEBSITE || "my-site"}
            apiKey={import.meta.env.VITE_ATN_API_KEY}
        >
            <AskChat />
        </AskProvider>
    );
}

export default App;
