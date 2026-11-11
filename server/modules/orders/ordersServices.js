export async function getCheckoutDetails(connection, productId, buyerId) {
  const [products] = await connection.execute(
    `SELECT p.id, p.title, p.price, p.status, p.seller_id,

            u.full_name AS seller_name

     FROM products p

     JOIN users u ON u.id = p.seller_id

     WHERE p.id = ?`,

    [productId],
  );

  const product = products[0];

  if (!product) {
    throw Object.assign(new Error("Product not found."), { status: 404 });
  }

  if (product.seller_id === buyerId) {
    throw Object.assign(new Error("You own this listing."), { status: 403 });
  }

  if (product.status !== "available") {
    throw Object.assign(new Error("This product is no longer available."), {
      status: 409,
    });
  }

  const [offers] = await connection.execute(
    `SELECT id, amount

     FROM offers

     WHERE product_id = ? AND buyer_id = ? AND status = 'accepted'

     ORDER BY id DESC

     LIMIT 1`,

    [productId, buyerId],
  );

  const acceptedOffer = offers[0];

  return {
    id: product.id,

    title: product.title,

    seller_id: product.seller_id,

    seller_name: product.seller_name,

    final_price: acceptedOffer ? acceptedOffer.amount : product.price,

    offer_id: acceptedOffer ? acceptedOffer.id : null,
  };
}
