import { useEffect, useState } from "react";
import { Box, HStack, ScrollView, Text, useTheme, VStack } from 'native-base';
import firestore from "@react-native-firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Header } from '../components/Header';
import { OrderProps } from "../components/Order";
import { OrderFirestoreDTO } from "../DTOs/OrderDTO";
import { dataFormat } from "../utils/firestoreDateFormat";
import { Loading } from "../components/Loading";
import { CircleWavyCheck, Hourglass, DesktopTower, ClipboardText } from "phosphor-react-native";
import { CardDetails } from "../components/CardDetails";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Alert } from "react-native";

type RouteParams = {
  orderId: string;
}

type OrderDetail = OrderProps & {
  description: string;
  solution: string;
  closed: string;
}

export function Details() {
  const [isLoading, setIsLoading] = useState(true);
  const [solution, setSolution] = useState("");
  const [order, setOrder] = useState({} as OrderDetail);
  const { colors } = useTheme();

  const navigation = useNavigation();

  const route = useRoute();
  const { orderId } = route.params as RouteParams;

  function handleOrdeClosed(){
    if(!solution) {
      return Alert.alert('Solução', 'Informe a solução para encerrar a solicitação.');
    }

    firestore()
    .collection('orders')
    .doc(orderId)
    .update({
      status: 'closed',
      solution,
      closed_at: firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      Alert.alert('Solicitação', 'Solicitação encerrada.')
      navigation.goBack();
    })
    .catch((error) => {
      console.log(error);
      Alert.alert('Solicitação', 'Não foi possível encerrar a solicitação.')
    })
  }

  useEffect(() => {
    firestore()
    .collection<OrderFirestoreDTO>('orders')
    .doc(orderId)
    .get()
    .then((doc) => {
      const { patrimony, description, status, created_at, closed_at, solution } = doc.data();

      const closed = closed_at ? dataFormat(closed_at) : null;

      setOrder({
        id: doc.id,
        patrimony,
        description,
        status,
        solution,
        when: dataFormat(created_at),
        closed
      });
      

      setIsLoading(false);
    });

  },[]);

  if(isLoading) {
    <Loading />
  }

  return (
    <VStack flex={1} bg='gray.700' >
      <Box px={6} bg='gray.600' >
        <Header title='Solicitação' />
      </Box> 
        <HStack bg='gray.500' justifyContent='center' p={4} >
          {
            order.status === 'closed' 
            ? <CircleWavyCheck size={22} color={colors.green[300]} /> 
            : <Hourglass size={22} color={colors.secondary[700]} />
          }

          <Text
            fontSize='sm' 
            color={order.status === 'closed' ? colors.green[300] : colors.secondary[700] }  
            ml={2}
            textTransform='uppercase'
          >
            { order.status === 'closed' ? 'Fechado' : 'em andamento'}            
          </Text>          
        </HStack>

        <ScrollView mx={5} showsHorizontalScrollIndicator={false} >
          <CardDetails 
            title="equipamento"
            description={`Patrimônio ${order.patrimony}`}
            icon={ DesktopTower }            
          />

          <CardDetails 
            title="descrição do problema"
            description={order.description}            
            icon={ ClipboardText }   
            footer={`Registrado em: ${order.when}`}         
          />

          <CardDetails 
            title="solução"            
            icon={ CircleWavyCheck }
            description={order.solution}  
            footer={ order.closed && `Encerrado em: ${order.closed}`}
          >
            {
              order.status === 'open' &&
              <Input
                placeholder="Descrição da solução"
                onChangeText={setSolution}
                h={24}
                textAlignVertical='top'
                multiline
              />
            }
          </CardDetails>

          {
            order.status === 'open' && 
              <Button
                title="Encerrar solicitação"
                m={5}
                onPress={handleOrdeClosed}
              />
          }

        </ScrollView>      
    </VStack>
  );
}