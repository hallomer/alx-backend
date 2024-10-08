import express from 'express';
import { createClient } from 'redis';
import { promisify } from 'util';

const app = express();
const client = createClient();
const getAsync = promisify(client.get).bind(client);
const PORT = 1245;

const listProducts = [
  { itemId: 1, itemName: 'Suitcase 250', price: 50, stock: 4 },
  { itemId: 2, itemName: 'Suitcase 450', price: 100, stock: 10 },
  { itemId: 3, itemName: 'Suitcase 650', price: 350, stock: 2 },
  { itemId: 4, itemName: 'Suitcase 1050', price: 550, stock: 5 },
];

function getItemById(id) {
  return listProducts.find(product => product.itemId === id);
}

app.get('/list_products', (req, res) => {
  res.json(listProducts);
});

app.get('/list_products/:itemId', async (req, res) => {
  const id = parseInt(req.params.itemId, 10);
  const product = getItemById(id);
  if (!product) return res.status(404).json({ status: 'Product not found' });

  const stock = await getAsync(`item.${id}`);
  product.currentQuantity = stock ? parseInt(stock, 10) : product.stock;
  res.json(product);
});

app.get('/reserve_product/:itemId', async (req, res) => {
  const id = parseInt(req.params.itemId, 10);
  const product = getItemById(id);
  if (!product) return res.status(404).json({ status: 'Product not found' });

  const stock = await getAsync(`item.${id}`);
  const currentStock = stock ? parseInt(stock, 10) : product.stock;

  if (currentStock <= 0) return res.status(400).json({ status: 'Not enough stock available', itemId: id });

  client.set(`item.${id}`, currentStock - 1);
  res.json({ status: 'Reservation confirmed', itemId: id });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
