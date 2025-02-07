import { CommandFactory } from 'nest-commander';
import { AppModule } from '../app.module';

async function bootstrap() {
  try {
    await CommandFactory.run(AppModule, ['warn']);
  } catch (error) {
    console.error('Error running seed command:', error);
    process.exit(1);
  }
}

bootstrap();
