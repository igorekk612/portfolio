import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import Admin from './pages/Admin'
import Catalog from './pages/Catalog'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import ProductPage from './pages/ProductPage'
import { Cancelled, Legal, NotFound, Success } from './pages/Simple'
import { CartProvider } from './state/cart'

const routes = [{
  element: <Layout />,
  children: [
    { path: '/', element: <Home /> },
    { path: '/katalog', element: <Catalog /> },
    { path: '/katalog/:kat', element: <Catalog /> },
    { path: '/produkt/:id', element: <ProductPage /> },
    { path: '/zamowienie', element: <Checkout /> },
    { path: '/dziekujemy', element: <Success /> },
    { path: '/anulowano', element: <Cancelled /> },
    { path: '/admin', element: <Admin /> },
    { path: '/regulamin', element: <Legal kind="regulamin" /> },
    { path: '/prywatnosc', element: <Legal kind="prywatnosc" /> },
    { path: '*', element: <NotFound /> },
  ],
}]

// Wersja demo (jeden plik HTML) używa adresów z #, normalna strona — zwykłych adresów.
const router = import.meta.env.MODE === 'demo' ? createHashRouter(routes) : createBrowserRouter(routes)

export default function App() {
  return <CartProvider><RouterProvider router={router} /></CartProvider>
}
