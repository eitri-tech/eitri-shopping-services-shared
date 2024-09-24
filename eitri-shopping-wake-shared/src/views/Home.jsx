/**
 * Basic template for creating applications with Eitri.
 */

// Importing the communication module with the Host App
import Eitri from "eitri-bifrost";

export default function Home(props) {

    /**
     * Similar to React, you can implement functionalities after the screen has
     * rendered or when specific dependencies change using useEffect. 
     */
    useEffect(() => {

        /**
         * Since we are using JavaScript here, you can use log messages like this
         * one below and track the log through your terminal.
         */
        console.log("This is an Eitri message", props);
    }, []);


    /**
     * You can also create functions at the root of the page class. These functions can be
     * assigned in the Views file.
     */
    const makeRequest = async () => {
        /**
         * Similar to what we do with the Axios library, you can also make
         * an HTTP call to an API. In this example, we are just loading a list of
         * products in JSON format to be used later.
         */
        const {data} = await Eitri.http.get('https://calindra.tech/eitri/product_list.json');

        console.log("Data obtained in HTTP call:", data);
    };


    return (
        <Window bottomInset backgroundColor="neutral-100" statusBarTextColor="white">
            <View>
                <HeaderComponent />
                <Image width="100%" height="200px" src="https://loremflickr.com/1280/600/brazil" />
                <View paddingHorizontal='small' paddingTop='nano'>
                    <Text fontSize='big' fontWeight='bold'>My Eitri-App</Text>
                </View>
                <Text wide paddingHorizontal='small' paddingTop='small' fontSize='small'>A modern way to address scalability and development speed issues.</Text>
                <Text wide paddingHorizontal='small' paddingTop='nano' fontSize='small'>The image above is a random image obtained via HTTP.</Text>
                <Text wide paddingHorizontal='small' paddingTop='nano' fontSize='small'>By pressing the button below, you will make an HTTP request, and the result of this request will be displayed in your terminal.</Text>
                <View paddingHorizontal='small' paddingTop='small'>
                    <Button block label="Make Request" onPress={makeRequest} />
                    <Button block variant="ghost" marginTop="small" label="Make Request" onPress={makeRequest} />
                </View>
            </View>
        </Window>
    )
}

