import { useDispatch, useSelector } from "react-redux";

import {
  removeFromCart,
  clearCart,
} from "../redux/cart/cartSlice";

export default function Cart() {

  const dispatch = useDispatch();

  const { items, total } = useSelector(
    (state) => state.cart
  );

  return (
    <div>

      <h2>Cart</h2>

      {items.map((item, index) => (

        <div
          key={index}

          style={{
            borderBottom: "1px solid #ddd",
            marginBottom: "10px",
            paddingBottom: "10px",
          }}
        >

          <h4>{item.name}</h4>

          <p>{item.price} Birr</p>
          <p><small>Assigned to: {item.staff}</small></p>

          <button
            onClick={() =>
              dispatch(removeFromCart(index))
            }
          >
            Remove
          </button>

        </div>
      ))}

      <h3>Total: {total} Birr</h3>

      <button onClick={() => dispatch(clearCart())}>
        Clear Cart
      </button>

    </div>
  );
}