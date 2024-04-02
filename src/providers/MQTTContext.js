import { createContext, useContext, useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

const MQTTContext = createContext();

export const useMQTT = () => useContext(MQTTContext);


const clearTrie = (node) => {
  node.handlers = []; // Clear handlers at the current node

  for (const key in node.children) {
    clearTrie(node.children[key]); // Recursively clear children
  }
};

const TrieNode = function() {
  this.children = {};
  this.handlers = []; // array to store multiple handlers. TODO: ignore this.
};

const addHandlerToTrie = (root, topic, handler) => {
  let node = root;
  const levels = topic.split('/');

  for (const level of levels) {
    if (!node.children[level]) {
      node.children[level] = new TrieNode();
    }
    node = node.children[level];
  }

  // if ( node.handlers.length == 1){
  //   console.warn(`topic ${topic} has multiple handlers`)
  // }
  node.handlers = [] // TODO: ignore the existing array, I couldn't figure out a way to clear it during navigation and not fill up with duplicates.
                     // what I need to do: turn the array into an object, keyed by the components name / usecase. then just overwrite per component.
                     // this requires adding a "name" to each use of subscribeToTopic.
  node.handlers.push(handler); // Add the handler to the array

};

const removeHandlersFromTrie = (root, topic) => {
  let node = root;
  const levels = topic.split('/');

  for (const level of levels) {
    if (!node.children[level]) {
      return; // Topic not found
    }
    node = node.children[level];
  }

  node.handlers = []; // Remove all handlers
};

const findHandlersInTrie = (root, topic) => {
  const levels = topic.split('/');
  let node = root;
  const handlers = [];

  const search = (index, currentNode) => {
    if (!currentNode) {
      return;
    }

    if (index === levels.length) {
      handlers.push(...currentNode.handlers); // Add all handlers at this node
      return;
    }

    const level = levels[index];

    // Check for exact match or wildcard '+'
    if (currentNode.children[level]) {
      search(index + 1, currentNode.children[level]);
    }
    if (currentNode.children['+']) {
      search(index + 1, currentNode.children['+']);
    }

    // Check for multi-level wildcard '#'
    if (currentNode.children['#']) {
      handlers.push(...currentNode.children['#'].handlers); // Add all handlers for the '#' wildcard
    }
  };

  search(0, node);

  return handlers;
};

export const MQTTProvider = ({name, config, children, experiment}) => {
  const [client, setClient] = useState(null);
  const topicTrie = useRef(new TrieNode());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (Object.keys(config).length) {
      const { username, password, ws_protocol, broker_address, broker_ws_port } = config.mqtt ?? {};
      const mqttClient = mqtt.connect(`${ws_protocol ?? 'ws'}://${broker_address ?? 'localhost'}:${broker_ws_port ?? 9001}/mqtt`, {
        username: username ?? 'pioreactor',
        password: password ?? 'raspberry',
        keepalive: 2 * 60,
      });

      mqttClient.on('connect', () => {
        console.log(`Connected to MQTT broker for ${name}.`);
      });

      mqttClient.on('message', (topic, message, packet) => {
        const handlers = findHandlersInTrie(topicTrie.current, topic);
        handlers.forEach((handler) => handler(topic, message, packet));
      });

      mqttClient.on('error', (error) => {
        if (error.message === 'client disconnecting'){
          return
        }
        console.log(`MQTT ${name} connection error: ${error}`);
        setError(`MQTT connection error: ${error}`);
      });

      mqttClient.on('close', () => {
        console.warn(`MQTT ${name} client connection closed`);
      });


      setClient(mqttClient);

      return () => {
        mqttClient.end();
        clearTrie(topicTrie.current);
      };
    }
  }, [config, name, experiment]);

  const subscribeToTopic = (topic, messageHandler) => {
    addHandlerToTrie(topicTrie.current, topic, messageHandler);
    client.subscribe(topic);
  };

  const unsubscribeFromTopic = (topic) => {
    removeHandlersFromTrie(topicTrie.current, topic);
    client?.unsubscribe(topic);
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

  return (
    <MQTTContext.Provider value={{ client, subscribeToTopic, unsubscribeFromTopic }}>
      {children}
      <Snackbar anchorOrigin={{vertical: "bottom", horizontal: "right"}} style={{maxWidth: "500px"}} open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" variant="filled">
          Failed to connect to MQTT. Is configuration for mqtt.broker_address correct? Currently set to {config?.mqtt?.broker_address}
        </Alert>
      </Snackbar>
    </MQTTContext.Provider>
  );
};