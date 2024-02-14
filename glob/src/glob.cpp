#include "dir.h"
#include "log.h"

#include <string>
#include <vector>

const char *pattern = "../../kmake/**";

using std::string;
using std::vector;

string find_base_dir(const string &pattern) {
	size_t last_break = pattern.size();
	for (size_t i = 0; i < pattern.size(); ++i) {
		if (pattern[i] == '/' || pattern[i] == '\\') {
			last_break = i;
		}
		else if (pattern[i] == '*') {
			return pattern.substr(0, last_break);
		}
	}
	return pattern;
}

string to_absolute(const string &path) {
	return string(working_dir()) + "/" + path;
}

vector<string> split(const string &path) {
	vector<string> parts;
	size_t last = 0;
	for (size_t i = 0; i < path.size(); ++i) {
		if (path[i] == '/' || path[i] == '\\') {
			parts.push_back(path.substr(last, i - last));
			last = i + 1;
		}
	}
	parts.push_back(path.substr(last));
	return parts;
}

int main(int argc, char **argv) {
	string absolute = to_absolute(pattern);

	string base = find_base_dir(pattern);
	directory dir = open_dir(base.c_str());
	file f = read_next_file(&dir);
	while (f.valid) {
		kmake_log(LOG_LEVEL_INFO, "Visited %s", f.name);
		f = read_next_file(&dir);
	}

	auto parts = split(pattern);
	for (auto &part : parts) {
		kmake_log(LOG_LEVEL_INFO, "Part: %s", part.c_str());
	}

	return 0;
}
