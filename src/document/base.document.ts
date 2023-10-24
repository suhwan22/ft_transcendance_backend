import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

export class BaseApiDocumention {
    public builder = new DocumentBuilder();

    public initializeOptions() {
        return (this.builder
                    .setTitle('Deer-Fear Pong')
                    .setDescription('Api Document')
                    .setVersion('1.0')
                    .build());
    }
}