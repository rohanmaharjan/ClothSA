from transformers import T5ForConditionalGeneration, AutoTokenizer

model_name = "t5-base"

# Download from Hugging Face
model = T5ForConditionalGeneration.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Save complete model locally
model.save_pretrained("./t5base")
tokenizer.save_pretrained("./t5base")

print("Model downloaded successfully")