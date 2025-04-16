import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InvoicePage from './pages/InvoicePage';
import ProductInfo from './ProductInfo'; 

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<ProductInfo />} />
                <Route path="/invoice/:id" element={<InvoicePage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
