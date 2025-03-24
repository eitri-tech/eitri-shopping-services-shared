import Vtex from "../services/Vtex";
import StorageService from "../services/StorageService";
import VtexCustomerService from "../services/vtex/customer/vtexCustomerService";

export default function CustomerMethods() {
  const [email, setEmail] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [password, setPassword] = useState("wagnerfq@gmail.com");

  const sendEmail = async () => {
    await Vtex.customer.sendAccessKeyByEmail(email);
  };

  const loginWithEmailAndAccessKey = async () => {
    console.log("loginWithEmailAndAccessKey", email, accessKey);
    const result = await Vtex.customer.loginWithEmailAndAccessKey(
      email,
      accessKey,
    );
    console.log("loginWithEmailAndAccessKey", result);
  };

  const isLogged = async () => {
    const logged = await Vtex.customer.isLoggedIn();
    console.log("isLogged", logged);
  };

  const getMyStoredToken = async () => {
    const savedToken = await Vtex.customer.getStorageCustomerToken();
    console.log("savedToken", savedToken);
  };

  return (
    <Window topInset bottomInset>
      <View
        padding="large"
        direction="column"
        gap={10}
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        <Button
          wide
          color="background-color"
          onPress={isLogged}
          label="Logado?"
        />
        <View display="flex" gap={10}>
          <Input
            placeholder="Email"
            grow={4}
            value={email}
            onChange={(value) => setEmail(value)}
          />
          <Button
            color="background-color"
            grow={1}
            onPress={sendEmail}
            label="Enviar email"
          />
        </View>
        <View display="flex" gap={10}>
          <Input
            placeholder="Access Key"
            inputType="numeric"
            grow={4}
            value={accessKey}
            onChange={(value) => setAccessKey(value)}
          />
          <Button
            color="background-color"
            grow={1}
            onPress={loginWithEmailAndAccessKey}
            label="Validar login"
          />
        </View>
        <View display="flex" gap={10}>
          <Button
            wide
            color="background-color"
            grow={1}
            onPress={getMyStoredToken}
            label="Meu token"
          />
        </View>
      </View>
    </Window>
  );
}
