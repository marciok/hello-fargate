import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";

// new aws.ec2.Vpc("hello-fargate-sandbox", {
//   cidrBlock: "10.0.0.0/16",
// });

const repository = new awsx.ecr.Repository("repo-sandbox");

// Invoke 'docker' to actually build the DockerFile that is in the 'app' folder relative to
// this program. Once built, push that image up to our personal ECR repo.
const image = repository.buildAndPushImage("./app")

// Create a load balancer to listen for requests and route them to the container.
const listener = new awsx.elasticloadbalancingv2.NetworkListener("nginx", { port: 80 });

// Define the service, building and publishing our "./app/Dockerfile", and using the load balancer.
const service = new awsx.ecs.FargateService("nginx-sandbox", {
  desiredCount: 2,
  taskDefinitionArgs: {
      containers: {
          nginx: {
              image,
              memory: 512,
              portMappings: [listener],
          },
      },
  },
});

// Export the URL so we can easily access it.
export const frontendURL = pulumi.interpolate `http://${listener.endpoint.hostname}/`;