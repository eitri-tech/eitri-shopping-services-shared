import Eitri from "eitri-bifrost";
import {View, Touchable, Image, Text} from 'eitri-luminus'
import ArrowLeftImage from "../assets/images/arrow_left.png";

export default function HeaderComponent(props) {
  const onBackClick = () => {
    Eitri.navigation.back();
  };

  return (
    <View backgroundColor="primary-500">
      <View topInset />
      <View
        direction="row"
        justifyContent="start"
        alignItems="center"
        padding="nano"
        minHeight={60}
        backgroundColor="primary-500"
      >
        <Touchable width={50} onPress={onBackClick}>
          <Image src={ArrowLeftImage} cover width={40} />
        </Touchable>
        <Text
          wide
          textAlign="left"
          color="neutral-100"
          fontWeight="bold"
          fontSize="small"
        >
          {props.title ?? "Meet Eitri!"}
        </Text>
      </View>
    </View>
  );
}
