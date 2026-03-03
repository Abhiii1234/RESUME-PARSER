/**
 * skills.js
 * Comprehensive technology skills dictionary for rule-based extraction.
 * Organized by category for better matching accuracy.
 */

'use strict';

const SKILLS_DICT = {
  languages: [
    'Java', 'Python', 'JavaScript', 'TypeScript', 'C', 'C++', 'C#', 'Go', 'Rust',
    'Kotlin', 'Swift', 'Scala', 'Ruby', 'PHP', 'R', 'MATLAB', 'Fortran', 'Bash',
    'Shell', 'Perl', 'Groovy', 'Dart', 'Elixir', 'Haskell', 'Lua', 'Assembly',
    'VBA', 'COBOL', 'ABAP', 'F#', 'Julia', 'Clojure', 'Erlang', 'OCaml',
    'PowerShell', 'Unix shell scripting'
  ],
  frontend: [
    'React', 'Angular', 'AngularJS', 'Vue', 'Vue.js', 'Next.js', 'Nuxt.js',
    'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind', 'jQuery',
    'Redux', 'MobX', 'Webpack', 'Vite', 'Babel', 'ESLint', 'TypeScript',
    'Material UI', 'Ant Design', 'Storybook', 'GraphQL', 'Apollo',
    'WebSocket', 'PWA', 'Responsive Design', 'UI/UX'
  ],
  backend: [
    'Node.js', 'Express', 'Express.js', 'Spring', 'Spring Boot', 'Django',
    'Flask', 'FastAPI', 'Rails', 'Laravel', 'ASP.NET', '.NET', 'Hibernate',
    'Kafka', 'RabbitMQ', 'Redis', 'Celery', 'gRPC', 'REST API',
    'RESTful', 'GraphQL', 'Microservices', 'Nginx', 'Apache', 'Tomcat',
    'Jersey', 'Quarkus', 'Micronaut', 'Vert.x', 'Play Framework',
    'NestJS', 'Fastify', 'Koa', 'Hapi.js'
  ],
  databases: [
    'MySQL', 'PostgreSQL', 'MongoDB', 'SQL Server', 'Oracle', 'SQLite',
    'Cassandra', 'DynamoDB', 'Firebase', 'Elasticsearch', 'Redis',
    'Neo4j', 'CouchDB', 'MariaDB', 'InfluxDB', 'TimescaleDB', 'Snowflake',
    'BigQuery', 'Redshift', 'DB2', 'Teradata', 'HBase', 'Couchbase',
    'SQL', 'NoSQL', 'RDBMS', 'Kibana', 'Logstash', 'ELK'
  ],
  cloud: [
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'Kubernetes', 'Docker',
    'Terraform', 'Ansible', 'Chef', 'Puppet', 'Jenkins', 'GitLab CI',
    'GitHub Actions', 'CircleCI', 'Travis CI', 'CloudFormation',
    'Helm', 'Istio', 'Lambda', 'EC2', 'S3', 'ECS', 'EKS', 'RDS',
    'Serverless', 'Pulumi', 'Vault', 'Consul', 'ArgoCD', 'Spinnaker',
    'Azure DevOps', 'OpenShift', 'Rancher', 'Prometheus', 'Grafana'
  ],
  ml_ai: [
    'Machine Learning', 'Deep Learning', 'AI', 'ML', 'TensorFlow',
    'PyTorch', 'Keras', 'scikit-learn', 'Pandas', 'NumPy', 'SciPy',
    'OpenCV', 'NLP', 'Computer Vision', 'LLM', 'Transformers',
    'BERT', 'GPT', 'Reinforcement Learning', 'Neural Networks',
    'Data Science', 'Feature Engineering', 'MLflow', 'Kubeflow',
    'Spark', 'Hadoop', 'Databricks', 'Airflow', 'Luigi', 'Dask',
    'XGBoost', 'LightGBM', 'Statsmodels', 'Matplotlib', 'Seaborn',
    'Plotly', 'Tableau', 'Power BI', 'Jupyter', 'Colab'
  ],
  devops: [
    'CI/CD', 'DevOps', 'DevSecOps', 'Agile', 'Scrum', 'Kanban',
    'JIRA', 'Confluence', 'Git', 'GitHub', 'GitLab', 'Bitbucket',
    'SVN', 'Mercurial', 'SonarQube', 'Nexus', 'Artifactory',
    'ELK Stack', 'Splunk', 'Datadog', 'New Relic', 'PagerDuty',
    'Unit Testing', 'Integration Testing', 'TDD', 'BDD',
    'RTOS', 'Embedded', 'FPGA', 'Linux', 'Windows', 'macOS',
    'MPI', 'OpenMP', 'HPC', 'CUDA', 'OpenCL'
  ],
  security: [
    'TS/SCI', 'Security Clearance', 'OAuth', 'JWT', 'SAML', 'SSO',
    'LDAP', 'Active Directory', 'PKI', 'TLS', 'SSL', 'Encryption',
    'Penetration Testing', 'SIEM', 'SOC', 'Zero Trust', 'IAM',
    'Cybersecurity', 'CISSP', 'CEH', 'CompTIA Security+'
  ],
  other: [
    'Protobuf', 'YAML', 'JSON', 'XML', 'SOAP', 'OpenAPI', 'Swagger',
    'Microservices', 'SOA', 'Domain Driven Design', 'SOLID',
    'Design Patterns', 'Object Oriented', 'Functional Programming',
    'Reactive Programming', 'Event Driven', 'CQRS', 'Event Sourcing',
    'Full Stack', 'Backend', 'Frontend', 'Mobile', 'iOS', 'Android',
    'React Native', 'Flutter', 'Xamarin', 'Ionic',
    'PostgreSQL', 'TypeScript', 'Go', 'Rust', 'Kotlin',
    'ActiveMQ', 'ZeroMQ', 'NATS', 'NSQ',
    'C/C++', 'FPGA', 'GPU', 'Signal Processing', 'Image Processing'
  ]
};

// Flatten all skills into a single deduplicated list
const ALL_SKILLS = [...new Set(
  Object.values(SKILLS_DICT).flat()
)];

// Build a normalized lookup map: lowercase -> original
const SKILLS_MAP = new Map();
ALL_SKILLS.forEach(skill => {
  SKILLS_MAP.set(skill.toLowerCase(), skill);
});

// Common skill aliases / synonyms
const SKILL_ALIASES = {
  'js': 'JavaScript',
  'ts': 'TypeScript',
  'nodejs': 'Node.js',
  'node js': 'Node.js',
  'reactjs': 'React',
  'react js': 'React',
  'vuejs': 'Vue.js',
  'angularjs': 'AngularJS',
  'springboot': 'Spring Boot',
  'spring-boot': 'Spring Boot',
  'k8s': 'Kubernetes',
  'gcp': 'Google Cloud',
  'postgres': 'PostgreSQL',
  'mongo': 'MongoDB',
  'mssql': 'SQL Server',
  'ms sql': 'SQL Server',
  'dotnet': '.NET',
  'dot net': '.NET',
  'c sharp': 'C#',
  'golang': 'Go',
  'py': 'Python',
  'cpp': 'C++',
  'restful api': 'REST API',
  'rest apis': 'REST API',
  'nosql': 'NoSQL',
  'machine learning': 'Machine Learning',
  'deep learning': 'Deep Learning',
  'artificial intelligence': 'AI',
  'natural language processing': 'NLP',
  'computer vision': 'Computer Vision',
  'elk stack': 'ELK',
  'ci cd': 'CI/CD',
  'ci/cd pipeline': 'CI/CD',
  'test driven development': 'TDD',
  'behavior driven development': 'BDD',
  'object oriented programming': 'Object Oriented',
  'oop': 'Object Oriented',
  'aws lambda': 'Lambda',
  'amazon web services': 'AWS',
  'google cloud platform': 'Google Cloud',
  'microsoft azure': 'Azure',
  'version control': 'Git',
  'source control': 'Git',
  'shell scripting': 'Bash',
  'bash scripting': 'Bash',
  'unit test': 'Unit Testing',
  'microservice': 'Microservices',
  'micro services': 'Microservices',
  'full-stack': 'Full Stack',
  'fullstack': 'Full Stack'
};

module.exports = { SKILLS_DICT, ALL_SKILLS, SKILLS_MAP, SKILL_ALIASES };
