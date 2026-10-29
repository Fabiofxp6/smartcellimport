import { getSettings } from "@/features/settings/service";
import { CartPage } from "@/components/cart/cart-page";
export const metadata = {
  title: "Meu carrinho",
  robots: { index: false, follow: false },
};
export default async function Cart() {
  return <CartPage settings={await getSettings()} />;
}
