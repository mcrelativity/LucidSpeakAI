import vertexai
from vertexai.preview.language_models import TextGenerationModel

# --- CONFIGURA ESTO CON TUS DATOS ---
PROJECT_ID = "lucidspeak"
LOCATION = "us-central1"
# ------------------------------------

def list_available_models():
    """
    Se conecta a tu proyecto de Google Cloud y lista todos los modelos de Vertex AI disponibles.
    """
    print(f"Conectando al proyecto '{PROJECT_ID}' en la región '{LOCATION}'...")
    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        
        # El método correcto para listar modelos es a través de TextGenerationModel o similar
        # Vamos a listar los modelos de una manera más general
        from google.cloud import aiplatform

        client = aiplatform.gapic.ModelServiceClient(
            client_options={"api_endpoint": f"{LOCATION}-aiplatform.googleapis.com"}
        )
        parent = f"projects/{PROJECT_ID}/locations/{LOCATION}"

        print("\n--- Modelos Disponibles para tu Proyecto ---")
        models_found = False
        for model in client.list_models(parent=parent):
            # Filtramos para mostrar solo los que nos interesan
            if 'gemini' in model.display_name:
                print(f"Nombre a usar en el código: '{model.display_name}'")
                print(f"   (ID completo: {model.name})\n")
                models_found = True
        
        if not models_found:
            print("No se encontraron modelos de Gemini. Asegúrate de que la API Vertex AI esté habilitada y la facturación activa.")
        print("-----------------------------------------")

    except Exception as e:
        print(f"\n--- Ocurrió un Error ---")
        print(f"Error: {e}")
        print("Asegúrate de que tu autenticación (gcloud auth) y el ID del proyecto sean correctos.")
        print("--------------------------")

if __name__ == "__main__":
    list_available_models()

