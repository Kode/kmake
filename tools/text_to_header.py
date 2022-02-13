#!/usr/bin/env python

import sys

def main():
	input_file = open(sys.argv[2], "rb")
	text = input_file.read().decode()
	input_file.close()

	output_file = open(sys.argv[3], "wb")
	output_file.write(("static const char " + sys.argv[1] + "[] = \"").encode("utf8"))
	output_file.write(text.replace("\\", "\\\\").replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t").replace("\"", "\\\"").encode("utf8"))
	output_file.write("\";\n".encode("utf8"))
	output_file.close()

if __name__ == "__main__":
	main()
