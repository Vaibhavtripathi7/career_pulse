type Metrics = {
    totalEmails: number;
    success: number;
    failed: number;
    llmCalls: number;
    llmFailures: number;
};

const metrics: Metrics = {
    totalEmails: 0,
    success: 0,
    failed: 0,
    llmCalls: 0,
    llmFailures: 0

};

export function increment(key: keyof Metrics){
    metrics[key]++;
}

export function getMetrices(){
    return metrics;
}