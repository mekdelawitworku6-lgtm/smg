import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cart/cartSlice";

export default function ServiceList({ services }) {

  const dispatch = useDispatch();

  return (
    <div>

      <h2>Services</h2>

      {services.map((service, index) => (

        <div
          key={index}

          style={{
            border: "1px solid var(--border-color)",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >

          <h4>{service.name}</h4>

          <p>{service.price} Birr</p>

          <button
            onClick={() =>
              dispatch(addToCart(service))
            }
          >
            Add
          </button>

        </div>
      ))}
    </div>
  );
}