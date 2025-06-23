// utils/amplify-config.ts
import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json"; // ajusta o caminho se estiver fora de src

Amplify.configure(outputs);
